declare module 'react-signature-canvas' {
  import { Component } from 'react'

  export interface SignatureCanvasProps {
    canvasProps?: {
      width?: number
      height?: number
      className?: string
      [key: string]: unknown
    }
    penColor?: string
    backgroundColor?: string
    velocityFilterWeight?: number
    minWidth?: number
    maxWidth?: number
    throttle?: number
    minDistance?: number
    dotSize?: number | (() => number)
    onEnd?: () => void
    onBegin?: () => void
  }

  export default class SignatureCanvas extends Component<SignatureCanvasProps> {
    clear(): void
    isEmpty(): boolean
    fromDataURL(dataURL: string): void
    toDataURL(mimeType?: string): string
    getCanvas(): HTMLCanvasElement
    getTrimmedCanvas(): HTMLCanvasElement
  }
}

