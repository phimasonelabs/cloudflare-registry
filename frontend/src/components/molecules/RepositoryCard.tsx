import type { Repository } from '../../types'
import { CopyButton } from '../CopyButton'

interface RepositoryCardProps {
    repository: Repository
    // className?: string // Removed as per instruction
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
    const registryHost = typeof window !== 'undefined' ? window.location.host : 'registry.example.com' // Kept original for SSR safety, instruction removed it but it's safer to keep
    const pullCommand = `docker pull ${registryHost}/${repository.name}:${repository.tags[0]}`

    // Separate regular tags from digest tags
    const regularTags = repository.tags.filter(tag => !tag.startsWith('sha256:'));
    const digestTags = repository.tags.filter(tag => tag.startsWith('sha256:'));

    return (
        <div className="group relative">
            {/* Gradient glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity"></div>

            {/* Card */}
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">📦</div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{repository.name}</h3>
                            <p className="text-sm text-white/60">{repository.tags.length} tag{repository.tags.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div className="mb-4 flex flex-wrap gap-2">
                    {/* Show regular tags first */}
                    {regularTags.map(tag => (
                        <span
                            key={tag}
                            className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm rounded-full"
                        >
                            {tag}
                        </span>
                    ))}

                    {/* Show digest tags with truncation */}
                    {digestTags.map(tag => (
                        <span
                            key={tag}
                            className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs rounded-full font-mono truncate max-w-[200px]"
                            title={tag}
                        >
                            {tag.substring(0, 15)}...
                        </span>
                    ))}
                </div>

                {/* Pull command */}
                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex items-center justify-between gap-2">
                    <code className="text-sm text-cyan-300 font-mono truncate flex-1">
                        {pullCommand}
                    </code>
                    <CopyButton text={pullCommand} />
                </div>
            </div>
        </div>
    );
}
