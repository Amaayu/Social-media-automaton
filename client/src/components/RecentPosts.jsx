import { useState, useEffect } from 'react';
import { aiPostAPI } from '../utils/api';

const RecentPosts = ({ refreshTrigger }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    console.log('[RecentPosts] Component mounted, refreshTrigger:', refreshTrigger);
    fetchPosts();
  }, [refreshTrigger]);

  const fetchPosts = async () => {
    try {
      console.log('[RecentPosts] Fetching posts...');
      setLoading(true);
      const response = await aiPostAPI.getHistory(); // Use the correct API helper
      console.log('[RecentPosts] Posts fetched:', response.data.posts?.length || 0);
      setPosts(response.data.posts || []);
      setError(null);
    } catch (err) {
      console.error('[RecentPosts] Failed to fetch posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    console.log('[RecentPosts] Delete button clicked for post:', postId);
    
    // More explicit confirmation dialog
    const confirmed = window.confirm(
      '⚠️ DELETE POST?\n\n' +
      'This will permanently delete this post from your history.\n\n' +
      '👉 Click OK to DELETE\n' +
      '👉 Click Cancel to keep the post'
    );
    console.log('[RecentPosts] User confirmation:', confirmed);
    
    if (!confirmed) {
      console.log('[RecentPosts] Delete cancelled by user - User clicked Cancel button');
      alert('ℹ️ Deletion cancelled. Post was not deleted.');
      return;
    }

    try {
      console.log('[RecentPosts] ✓ User clicked OK - Proceeding with deletion...');
      console.log('[RecentPosts] Deleting post:', postId);
      setDeletingId(postId);
      
      const response = await aiPostAPI.deletePost(postId);
      console.log('[RecentPosts] Delete API response:', response);
      console.log('[RecentPosts] ✓ Post deleted successfully from backend');
      
      // Remove from local state
      setPosts(prevPosts => {
        const newPosts = prevPosts.filter(p => p.id !== postId);
        console.log('[RecentPosts] ✓ Updated posts list, removed post:', postId);
        console.log('[RecentPosts] Remaining posts:', newPosts.length);
        return newPosts;
      });
      
      // Show success message
      alert('✅ Post deleted successfully!');
    } catch (err) {
      console.error('[RecentPosts] Failed to delete post:', err);
      console.error('[RecentPosts] Error details:', err.response?.data || err.message);
      alert(`❌ Failed to delete post: ${err.response?.data?.error || err.message}`);
    } finally {
      setDeletingId(null);
      console.log('[RecentPosts] Delete operation completed');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      published: { color: 'bg-green-100 text-green-800', icon: '✓', label: 'Published' },
      draft: { color: 'bg-gray-100 text-gray-800', icon: '📝', label: 'Draft' },
      failed: { color: 'bg-red-100 text-red-800', icon: '✗', label: 'Failed' },
      publishing: { color: 'bg-blue-100 text-blue-800', icon: '⏳', label: 'Publishing' }
    };
    return badges[status] || badges.draft;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
        <div className="text-center py-8 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Posts</h3>
          <button
            onClick={fetchPosts}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">📝</p>
            <p>No posts yet</p>
            <p className="text-sm mt-1">Generate your first AI post to get started!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={handleDelete}
              isDeleting={deletingId === post.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Helper function to get status badge
const getStatusBadge = (status) => {
  const badges = {
    published: { color: 'bg-green-100 text-green-800', icon: '✓', label: 'Published' },
    draft: { color: 'bg-gray-100 text-gray-800', icon: '📝', label: 'Draft' },
    failed: { color: 'bg-red-100 text-red-800', icon: '✗', label: 'Failed' },
    publishing: { color: 'bg-blue-100 text-blue-800', icon: '⏳', label: 'Publishing' }
  };
  return badges[status] || badges.draft;
};

const PostCard = ({ post, onDelete, isDeleting }) => {
  const [expanded, setExpanded] = useState(false);
  const badge = getStatusBadge(post.status);

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors relative">
      <div className="flex items-start space-x-3">
        {/* Image Thumbnail */}
        {post.imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={post.imageUrl}
              alt="Post"
              className="w-16 h-16 rounded object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(post.publishedAt || post.createdAt)}
              </span>
            </div>
            
            {/* Delete Button - Moved to header for better visibility */}
            <button
              type="button"
              onClick={(e) => {
                console.log('[PostCard] Delete button clicked!');
                console.log('[PostCard] Post ID:', post.id);
                console.log('[PostCard] onDelete function:', typeof onDelete);
                alert('Delete button clicked! Check console.');
                e.preventDefault();
                e.stopPropagation();
                if (typeof onDelete === 'function') {
                  console.log('[PostCard] Calling onDelete...');
                  onDelete(post.id);
                } else {
                  console.error('[PostCard] onDelete is not a function!');
                  alert('Error: onDelete is not a function');
                }
              }}
              disabled={isDeleting}
              style={{
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                pointerEvents: 'auto',
                zIndex: 10
              }}
              className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
              title="Delete post"
            >
              {isDeleting ? '⏳ Deleting...' : '🗑️ Delete'}
            </button>
          </div>

          {/* Caption */}
          <p className="text-sm text-gray-700 mb-2">
            {expanded ? post.caption : truncateText(post.caption)}
          </p>

          {/* Error Message (if failed) */}
          {post.status === 'failed' && post.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <span className="font-semibold">Error: </span>
              {post.error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3 mt-2">
            {post.caption && post.caption.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
            {post.status === 'published' && post.instagramMediaId && (
              <a
                href={`https://www.instagram.com/p/${post.instagramMediaId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>View on Instagram</span>
                <span>↗</span>
              </a>
            )}
          </div>

          {/* Metadata */}
          {post.metadata && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.metadata.topics?.map((topic, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentPosts;
