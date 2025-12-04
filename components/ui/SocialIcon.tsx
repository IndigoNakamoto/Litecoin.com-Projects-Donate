import React from 'react'
import {
  FaXTwitter,
  FaTwitter,
  FaRedditAlien,
  FaFacebookF,
  FaGithub,
  FaLinkedin,
  FaYoutube,
  FaEnvelope,
  FaCircleInfo,
  FaGlobe,
} from 'react-icons/fa6'
import {
  FaDiscord,
  FaTelegram,
} from 'react-icons/fa6'

interface SocialIconProps {
  kind: string
  href?: string
  noLink?: boolean
  size?: number
  className?: string
}

const SocialIcon: React.FC<SocialIconProps> = ({
  kind,
  href,
  noLink = false,
  size = 20,
  className = '',
}) => {
  const iconProps = {
    size: size,
    className: className || 'text-gray-700',
  }

  const getIcon = () => {
    switch (kind.toLowerCase()) {
      case 'twitter':
      case 'x':
        return <FaXTwitter {...iconProps} />
      case 'github':
        return <FaGithub {...iconProps} />
      case 'discord':
        return <FaDiscord {...iconProps} />
      case 'telegram':
        return <FaTelegram {...iconProps} />
      case 'facebook':
        return <FaFacebookF {...iconProps} />
      case 'reddit':
        return <FaRedditAlien {...iconProps} />
      case 'linkedin':
        return <FaLinkedin {...iconProps} />
      case 'youtube':
        return <FaYoutube {...iconProps} />
      case 'email':
        return <FaEnvelope {...iconProps} />
      case 'website':
        return <FaGlobe {...iconProps} />
      case 'info':
        return <FaCircleInfo {...iconProps} />
      default:
        return <FaGlobe {...iconProps} />
    }
  }

  if (noLink || !href) {
    return getIcon()
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block"
    >
      {getIcon()}
    </a>
  )
}

export default SocialIcon

