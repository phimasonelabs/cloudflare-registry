interface UserAvatarProps {
    src?: string | null;
    email: string;
    name?: string | null;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export function UserAvatar({ src, email, name, size = 'medium', className = '' }: UserAvatarProps) {
    const getPixelArtUrl = () => {
        return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(email)}`;
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = getPixelArtUrl();
    };

    const sizeClasses = {
        small: 'user-avatar-small',
        medium: 'user-avatar-medium',
        large: 'user-avatar-large'
    };

    return (
        <img
            src={src || getPixelArtUrl()}
            alt={name || email}
            className={`user-avatar ${sizeClasses[size]} ${className}`}
            onError={handleError}
        />
    );
}
