import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Topic, ReferenceNote } from '../types';

// Storage keys
const SUPABASE_URL_KEY = 'moneymuse_sb_url';
const SUPABASE_KEY_KEY = 'moneymuse_sb_key';
const LOCAL_DATA_KEY = 'moneymuse_local_topics';

// Default Credentials (Fallback) - 优先级: localStorage > 环境变量 > 默认值
const ENV_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const DEFAULT_URL = 'https://sfmsbwpskrvtktoywrag.supabase.co';
const DEFAULT_KEY = '';

export const getStoredCredentials = () => {
  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY);
  const storedKey = localStorage.getItem(SUPABASE_KEY_KEY);
  return {
    // 优先级: localStorage > 环境变量 > 默认值
    url: (storedUrl || ENV_URL || DEFAULT_URL).trim(),
    key: (storedKey || ENV_KEY || DEFAULT_KEY).trim(),
  };
};

export const saveCredentials = (url: string, key: string) => {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
  window.location.reload();
};

let supabase: SupabaseClient | null = null;
const { url, key } = getStoredCredentials();

const isKeyValid = key.length > 20 && key.includes('.');

if (url && isKeyValid) {
  try {
    supabase = createClient(url, key, {
      auth: { persistSession: false }
    });
  } catch (e) {
    console.error("Failed to init supabase", e);
  }
}

export const getTopics = async (): Promise<Topic[]> => {
  if (supabase) {
    try {
        const { data, error } = await supabase.from('topics').select('*').order('created_at', { ascending: false });
        if (!error && data) return data as Topic[];
        if (error) throw error;
    } catch (e) {
        console.error("Cloud fetch failed, using local storage:", e);
    }
  }
  const local = localStorage.getItem(LOCAL_DATA_KEY);
  return local ? JSON.parse(local) : [];
};

export const addTopic = async (topic: Topic): Promise<void> => {
  let savedToCloud = false;
  if (supabase) {
    try {
      const { error } = await supabase.from('topics').insert([topic]);
      if (!error) {
        savedToCloud = true;
      } else {
        throw error;
      }
    } catch (e) {
      console.warn("Cloud insert failed, falling back to local storage.");
    }
  }
  
  if (!savedToCloud) {
    await saveLocally(topic);
  }
};

const saveLocally = async (topic: Topic) => {
    const local = localStorage.getItem(LOCAL_DATA_KEY);
    const current = local ? JSON.parse(local) : [];
    // Ensure no duplicates by ID
    const updated = [topic, ...current.filter((t: any) => t.id !== topic.id)];
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(updated));
}

export const updateTopicStatus = async (id: string, status: Topic['status']): Promise<void> => {
  let updatedInCloud = false;
  if (supabase) {
    try {
      const { error } = await supabase.from('topics').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (!error) updatedInCloud = true;
    } catch (e) {
      console.warn("Cloud update status failed.");
    }
  }
  
  if (!updatedInCloud) {
    const current = await getTopics();
    const updated = current.map(t => t.id === id ? { ...t, status, updated_at: new Date().toISOString() } : t);
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(updated));
  }
};

export const updateTopicDetails = async (id: string, updates: Partial<Topic>): Promise<void> => {
  let updatedInCloud = false;
  if (supabase) {
    try {
      const { error } = await supabase.from('topics').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (!error) updatedInCloud = true;
    } catch (e) {
      console.warn("Cloud update details failed.");
    }
  }
  
  if (!updatedInCloud) {
    const current = await getTopics();
    const updated = current.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t);
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(updated));
  }
};

export const deleteTopic = async (id: string): Promise<void> => {
  if (supabase) {
    try {
      await supabase.from('topics').delete().eq('id', id);
    } catch (e) {
      console.warn("Cloud delete failed.");
    }
  }
  const current = await getTopics();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(updated));
};

export const isCloudEnabled = () => !!supabase;

export const testConnection = async (url: string, key: string): Promise<boolean> => {
  try {
    const tempClient = createClient(url, key);
    const { error } = await tempClient.from('topics').select('id').limit(1);
    return !error;
  } catch (err) {
    return false;
  }
};

// ============================================
// Reference Notes - 优质笔记参考库操作
// ============================================

const REFERENCE_NOTES_KEY = 'moneymuse_reference_notes';

/**
 * 获取所有参考笔记
 */
export const getReferenceNotes = async (): Promise<ReferenceNote[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reference_notes')
        .select('*')
        .order('likes', { ascending: false });
      if (!error && data) return data as ReferenceNote[];
      if (error) throw error;
    } catch (e) {
      console.error("Cloud fetch reference notes failed, using local storage:", e);
    }
  }
  const local = localStorage.getItem(REFERENCE_NOTES_KEY);
  return local ? JSON.parse(local) : [];
};

/**
 * 批量添加参考笔记
 */
export const addReferenceNotes = async (notes: ReferenceNote[]): Promise<{ success: boolean; added: number; error?: string }> => {
  if (notes.length === 0) {
    return { success: false, added: 0, error: '没有可导入的笔记' };
  }

  let savedToCloud = false;

  if (supabase) {
    try {
      const { error } = await supabase.from('reference_notes').insert(notes);
      if (!error) {
        savedToCloud = true;
        return { success: true, added: notes.length };
      }
      throw error;
    } catch (e) {
      console.warn("Cloud insert reference notes failed, falling back to local storage:", e);
    }
  }

  if (!savedToCloud) {
    try {
      const local = localStorage.getItem(REFERENCE_NOTES_KEY);
      const current: ReferenceNote[] = local ? JSON.parse(local) : [];

      // 根据 note_id 去重
      const existingIds = new Set(current.map(n => n.note_id));
      const newNotes = notes.filter(n => !existingIds.has(n.note_id));

      const updated = [...newNotes, ...current];
      localStorage.setItem(REFERENCE_NOTES_KEY, JSON.stringify(updated));

      return { success: true, added: newNotes.length };
    } catch (e) {
      return { success: false, added: 0, error: '本地存储失败' };
    }
  }

  return { success: true, added: notes.length };
};

/**
 * 删除单条参考笔记
 */
export const deleteReferenceNote = async (id: string): Promise<void> => {
  if (supabase) {
    try {
      await supabase.from('reference_notes').delete().eq('id', id);
    } catch (e) {
      console.warn("Cloud delete reference note failed.");
    }
  }
  const current = await getReferenceNotes();
  const updated = current.filter(n => n.id !== id);
  localStorage.setItem(REFERENCE_NOTES_KEY, JSON.stringify(updated));
};

/**
 * 清空参考库
 */
export const clearReferenceNotes = async (): Promise<void> => {
  if (supabase) {
    try {
      // 删除所有记录
      await supabase.from('reference_notes').delete().neq('id', '');
    } catch (e) {
      console.warn("Cloud clear reference notes failed.");
    }
  }
  localStorage.removeItem(REFERENCE_NOTES_KEY);
};