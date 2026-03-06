import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

/**
 * Avatar component với fallback thông minh:
 * 1. Nếu có ảnh → hiển thị ảnh
 * 2. Nếu có tên → hiển thị chữ cái đầu (initials)
 * 3. Nếu không có gì → hiển thị icon user
 */
export default function Avatar({ 
  src, 
  name, 
  size = 'md', 
  className = '',
  alt 
}: AvatarProps) {
  // Generate initials from name
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    // Lấy chữ cái đầu của từ đầu và từ cuối (họ và tên)
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Generate consistent color based on name
  const getColorFromName = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-cyan-500',
      'bg-teal-500',
      'bg-orange-500',
    ];
    
    // Simple hash function to get consistent color for same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const sizeClass = sizeClasses[size];
  const baseClasses = `${sizeClass} rounded-full flex items-center justify-center ${className}`;

  const [imageError, setImageError] = React.useState(false);

  // Case 1: Có ảnh và chưa bị lỗi
  if (src && !imageError) {
    const imageUrl = src.startsWith('http') 
      ? src 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}${src}`;

    return (
      <img
        src={imageUrl}
        alt={alt || name || 'Avatar'}
        className={`${baseClasses} object-cover border-2 border-slate-200`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Case 2: Có tên → hiển thị initials
  if (name) {
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);

    return (
      <div className={`${baseClasses} ${bgColor} text-white font-semibold`}>
        {initials}
      </div>
    );
  }

  // Case 3: Không có gì → hiển thị icon user
  return (
    <div className={`${baseClasses} bg-slate-200 text-slate-500`}>
      <User size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 16 : size === 'lg' ? 20 : 24} />
    </div>
  );
}
