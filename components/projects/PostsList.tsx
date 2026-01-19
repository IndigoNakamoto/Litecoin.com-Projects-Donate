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

  // Filter and render only posts with valid links
  const renderedPosts = posts
    .map((post) => {
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

      // If no valid link found, log to console but don't render debug output in UI
      console.warn(`[PostsList] Post ${id} has no valid links. Field data:`, fieldData)
      
      // Return null to filter out posts without valid links
      return null
    })
    .filter((post) => post !== null)

  if (renderedPosts.length === 0) {
    return (
      <div className="posts-list">
        <h2>Posts</h2>
        <p>No posts available for this project.</p>
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

