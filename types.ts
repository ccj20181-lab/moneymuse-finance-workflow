export type SeriesType = 'knowledge' | 'hotspot' | 'diagram';
export type StatusType = 'idea' | 'scripting' | 'published';

export interface Topic {
  id: string;
  title: string;
  note?: string;
  series: SeriesType;
  status: StatusType;
  created_at: string;
  updated_at: string;
  is_urgent?: boolean; // For hot topics
  target_date?: string; // ISO date string YYYY-MM-DD
}

export const SERIES_LABELS: Record<SeriesType, string> = {
  knowledge: '秒懂金融小知识',
  hotspot: '每天秒懂一个财经热点',
  diagram: '一图学金融',
};

export const SERIES_ICONS: Record<SeriesType, string> = {
    knowledge: 'BookOpen',
    hotspot: 'Zap',
    diagram: 'PieChart'
};

export const SERIES_COLORS: Record<SeriesType, string> = {
  knowledge: 'bg-blue-100 text-blue-700 border-blue-200',
  hotspot: 'bg-orange-100 text-orange-700 border-orange-200',
  diagram: 'bg-purple-100 text-purple-700 border-purple-200',
};

export const STATUS_LABELS: Record<StatusType, string> = {
  idea: '灵感 / 待选',
  scripting: '正在创作',
  published: '已发布',
};

// Reference Note - 优质笔记参考库数据结构
export interface ReferenceNote {
  id: string;
  note_id: string;        // 小红书笔记ID
  note_link: string;      // 笔记链接
  note_type: string;      // 图文/视频
  title: string;          // 笔记标题
  content: string;        // 笔记内容
  likes: number;          // 点赞量
  favorites: number;      // 收藏量
  comments: number;       // 评论量
  shares: number;         // 分享量
  published_at: string;   // 发布时间
  author_id: string;      // 博主ID
  author_link: string;    // 博主链接
  author_name: string;    // 博主昵称
  image_count: number;    // 图片数量
  cover_url: string;      // 封面链接
  created_at: string;     // 导入时间
}
