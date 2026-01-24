import React from 'react';
import { Heart, Bookmark, MessageCircle, Share2, ExternalLink, Trash2, User, Image, Video } from 'lucide-react';
import { ReferenceNote } from '../types';

interface ReferenceNoteCardProps {
  note: ReferenceNote;
  onDelete: (id: string) => void;
}

// Format large numbers
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}w`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

const ReferenceNoteCard: React.FC<ReferenceNoteCardProps> = ({ note, onDelete }) => {
  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (note.note_link) {
      window.open(note.note_link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(note.id);
  };

  const isVideo = note.note_type?.includes('视频');

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-brand-200 transition-all group">
      {/* Cover Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {note.cover_url ? (
          <img
            src={note.cover_url}
            alt={note.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Image className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Type Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold backdrop-blur-sm ${
          isVideo ? 'bg-purple-500/90 text-white' : 'bg-white/90 text-gray-700'
        }`}>
          {isVideo ? <Video className="w-3 h-3 inline mr-1" /> : <Image className="w-3 h-3 inline mr-1" />}
          {note.note_type || '图文'}
        </div>

        {/* Image Count */}
        {note.image_count > 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold bg-black/50 text-white backdrop-blur-sm">
            {note.image_count} 图
          </div>
        )}

        {/* Actions Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 right-2 flex gap-1">
            {note.note_link && (
              <button
                onClick={handleOpenLink}
                className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-sm"
                title="打开原文"
              >
                <ExternalLink className="w-4 h-4 text-gray-700" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 bg-white/90 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
              title="删除"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 mb-2 text-[15px]">
          {note.title || '(无标题)'}
        </h3>

        {/* Content Preview */}
        {note.content && (
          <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">
            {note.content}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-red-400" />
            {formatNumber(note.likes)}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            {formatNumber(note.favorites)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
            {formatNumber(note.comments)}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-green-400" />
            {formatNumber(note.shares)}
          </span>
        </div>

        {/* Author & Date */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
              <User className="w-3 h-3 text-brand-600" />
            </div>
            {note.author_link ? (
              <a
                href={note.author_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-gray-600 hover:text-brand-600 transition-colors truncate max-w-[100px]"
                onClick={(e) => e.stopPropagation()}
              >
                {note.author_name || '未知博主'}
              </a>
            ) : (
              <span className="text-xs font-medium text-gray-600 truncate max-w-[100px]">
                {note.author_name || '未知博主'}
              </span>
            )}
          </div>
          {note.published_at && (
            <span className="text-[10px] text-gray-400">
              {note.published_at.split(' ')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceNoteCard;
