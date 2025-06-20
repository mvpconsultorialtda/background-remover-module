# Background Remover Module

Advanced background removal component with manual editing tools for React applications.

## Features

- Multiple background removal algorithms (Canvas, Edge Detection, Color Segmentation, Hybrid)
- Automatic image quality enhancement
- Manual editing tools (brush and eraser)
- Zoom and pan functionality
- Mobile-friendly interface
- TypeScript support

## Installation

\`\`\`bash
npm install @realbasquete/background-remover
\`\`\`

## Usage

\`\`\`tsx
import React, { useState } from 'react';
import { BackgroundRemovalModal } from '@realbasquete/background-remover';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleConfirm = (processedImageUrl: string, blob: Blob) => {
    console.log('Processed image:', processedImageUrl);
    setIsModalOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Open Background Remover
      </button>
      
      <BackgroundRemovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        originalImage={imageUrl}
        onConfirm={handleConfirm}
        options={{
          tolerance: 30,
          method: 'hybrid',
          enhanceQuality: true
        }}
      />
    </div>
  );
}
\`\`\`

## API Reference

### BackgroundRemovalModal Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | boolean | Yes | Controls modal visibility |
| onClose | () => void | Yes | Called when modal is closed |
| originalImage | string | Yes | URL of the original image |
| originalFile | File | No | Original file object |
| onConfirm | (url: string, blob: Blob) => void | Yes | Called when user confirms the processed image |
| options | BackgroundRemovalOptions | No | Processing options |
| className | string | No | Additional CSS classes |

### BackgroundRemovalOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| tolerance | number | 30 | Sensitivity for background removal (1-100) |
| method | 'canvas' \| 'edge' \| 'color' \| 'hybrid' | 'canvas' | Background removal algorithm |
| enhanceQuality | boolean | true | Enable automatic quality enhancement |

## License

MIT
