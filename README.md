# Music Annotation Tool

## Overview

This application is designed to streamline the process of annotating audio files from the Free Music Archive (FMA) Small dataset. It provides a user-friendly interface for listening to audio tracks, selecting segments, and adding detailed annotations including descriptions, instruments, moods, tempo, and genres.

## Purpose

The primary purpose of this tool is to create a high-quality labeled dataset for training music generation AI models like MusicLM. By annotating audio segments with rich metadata, we can:

1. Train models to understand the relationship between textual descriptions and audio characteristics
2. Generate more accurate and contextually appropriate music based on text prompts
3. Create a structured dataset that captures musical attributes in a consistent format

## Features

- **Waveform Visualization**: Interactive audio waveform display with region selection
- **Audio Playback Controls**: Play, pause, skip forward/backward, and loop selected regions
- **Automatic BPM Detection**: Uses audio analysis to detect and suggest tempo values
- **Structured Annotation**: Capture multiple dimensions of musical information:
  - Textual descriptions
  - Instruments present
  - Emotional moods
  - Tempo (BPM)
  - Musical genres
- **Progress Tracking**: Monitor annotation progress across the entire dataset
- **Audio Processing**: Automatically processes selected segments for training (trimming, converting to mono, standardizing sample rate)

## Technical Implementation

The application is built with:

- **Next.js**: React framework for the frontend and API routes
- **Firebase**: For storing annotation data and tracking progress
- **AWS S3**: For storing and retrieving audio files
- **WaveSurfer.js**: For audio visualization and interaction
- **Web Audio API**: For audio processing and BPM detection
- **FFmpeg**: For server-side audio processing

## Workflow

1. The system automatically selects the next unannotated track from the FMA Small dataset
2. Users can listen to the track and select a meaningful segment (default is 10 seconds)
3. The BPM is automatically detected and rounded to the nearest 10 for consistency
4. Users add descriptive text and select relevant instruments, moods, and genres
5. Upon saving, the selected audio segment is processed (trimmed, converted to mono, resampled)
6. The processed audio and annotations are stored for later use in AI training
7. The system advances to the next track automatically

## Extensibility

While designed specifically for the FMA Small dataset, this tool can be easily adapted for:

- Other music datasets by modifying the track selection logic
- Sound effect libraries by adjusting the annotation categories
- Voice or speech datasets by changing the metadata fields
- Any audio annotation task requiring segment selection and structured labeling

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Configure environment variables for Firebase and AWS S3
4. Run the development server with `npm run dev`
5. Access the application at `http://localhost:3000`

## Environment Variables

The following environment variables need to be set:

```bash
S3_BUCKET_NAME=your-bucket-name
S3_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## Future Improvements

- Support for batch annotation to increase efficiency
- Integration with AI-assisted annotation suggestions
- Enhanced audio analysis for more detailed feature extraction
- Export functionality for different AI training formats
- User management for collaborative annotation projects

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

We welcome contributions! Please fork the repository and create a pull request with your changes.
