// components/projects/PostsList.tsx

import React from 'react'
import PostX from './PostX'
import PostYouTube from './PostYouTube'
import PostReddit from './PostReddit'
import { extractYouTubeID, extractXPostID } from '@/utils/extractIds'
import type { Post } from '@/services/webflow/posts'

interface PostsListProps {
  posts: Post[]
}

const PostsList: React.FC<PostsListProps> = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="posts-list">
        <h2>Posts</h2>
        <p>No posts available for this project.</p>
      </div>
    )
  }

  const renderedPosts = posts.map((post) => {
    const { id, fieldData } = post
    
    // Access fields using the correct property names with dashes
    const xPostLink = fieldData['x-post-link']
    const youtubeLink = fieldData['youtube-link']
    const redditLink = fieldData['reddit-link']
    
    // Also check for a single 'link' field (as in old implementation)
    // Use type assertion for fields not in the type definition
    const link = (fieldData as Record<string, unknown>).link as string | undefined

    // If there's a single 'link' field, try to determine its type
    if (link && !xPostLink && !youtubeLink && !redditLink) {
      if (link.includes('youtube.com') || link.includes('youtu.be')) {
        const YouTubeID = extractYouTubeID(link)
        if (YouTubeID) {
          return (
            <div key={id} className="post-item">
              <PostYouTube YouTubeID={YouTubeID} />
            </div>
          )
        }
      } else if (link.includes('x.com') || link.includes('twitter.com')) {
        const XPostID = extractXPostID(link)
        if (XPostID) {
          return (
            <div key={id} className="post-item">
              <PostX XPostID={XPostID} />
            </div>
          )
        }
      } else if (link.includes('reddit.com')) {
        return (
          <div key={id} className="post-item">
            <PostReddit redditPostURL={link} />
          </div>
        )
      }
    }

    // Check each link type and render accordingly
    if (youtubeLink) {
      const YouTubeID = extractYouTubeID(youtubeLink)
      if (YouTubeID) {
        return (
          <div key={id} className="post-item">
            <PostYouTube YouTubeID={YouTubeID} />
          </div>
        )
      }
    }

    if (xPostLink) {
      const XPostID = extractXPostID(xPostLink)
      if (XPostID) {
        return (
          <div key={id} className="post-item">
            <PostX XPostID={XPostID} />
          </div>
        )
      }
    }

    if (redditLink) {
      return (
        <div key={id} className="post-item">
          <PostReddit redditPostURL={redditLink} />
        </div>
      )
    }

    // If no valid link found, show debug info
    console.warn(`[PostsList] Post ${id} has no valid links. Field data:`, JSON.stringify(fieldData, null, 2))
    return (
      <div key={id} className="post-item p-4 border border-gray-300 rounded">
        <p className="text-sm text-gray-500">Post {id} - No valid links found</p>
        <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(fieldData, null, 2)}</pre>
      </div>
    )
  })

  if (renderedPosts.length === 0) {
    return (
      <div className="posts-list">
        <h2>Posts</h2>
        <p>Posts found but no valid links detected. Check console for details.</p>
      </div>
    )
  }

  return (
    <div className="posts-list">
      <h2>Posts</h2>
      {renderedPosts}
    </div>
  )
}

export default PostsList

