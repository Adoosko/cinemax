# AWS S3 Setup for CinemaX Video Streaming

## Required Environment Variables

Add these to your `.env` file:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
NEXT_PUBLIC_AWS_S3_BUCKET=your-s3-bucket-name
NEXT_PUBLIC_AWS_S3_REGION=us-east-1
NEXT_PUBLIC_AWS_CLOUDFRONT_URL=https://your-cloudfront-distribution.cloudfront.net
```

## AWS Setup Steps

### 1. Create S3 Bucket

1. Go to AWS S3 Console
2. Create a new bucket (e.g., `cinemax-videos`)
3. Enable public read access for video streaming
4. Set up CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### 2. Create IAM User

1. Go to AWS IAM Console
2. Create a new user for programmatic access
3. Attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectAcl",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

### 3. Set up CloudFront (Optional but Recommended)

1. Go to AWS CloudFront Console
2. Create a new distribution
3. Set origin to your S3 bucket
4. Configure caching behaviors for video files
5. Update `NEXT_PUBLIC_AWS_CLOUDFRONT_URL` with your distribution URL

### 4. Folder Structure in S3

The system will create the following structure:

```
your-bucket/
├── videos/
│   └── {movieId}/
│       ├── 4k.mp4
│       ├── 1080p.mp4
│       ├── 720p.mp4
│       └── 480p.mp4
├── thumbnails/
│   └── {movieId}/
│       ├── 0.jpg
│       ├── 10.jpg
│       └── ...
├── posters/
│   └── {movieId}.jpg
└── subtitles/
    └── {movieId}/
        ├── en.vtt
        └── es.vtt
```

## Cost Optimization Tips

1. **Use S3 Intelligent Tiering** for automatic cost optimization
2. **Set up CloudFront** to reduce S3 data transfer costs
3. **Use S3 Lifecycle policies** to move old videos to cheaper storage classes
4. **Monitor usage** with AWS Cost Explorer

## Security Best Practices

1. **Use presigned URLs** for secure video streaming
2. **Implement proper CORS** policies
3. **Use IAM roles** instead of access keys when possible
4. **Enable S3 bucket logging** for audit trails
5. **Set up proper bucket policies** to restrict access

## Video Upload Process

1. Admin selects video files in the admin panel
2. System generates presigned upload URLs
3. Videos are uploaded directly to S3
4. URLs are stored in the database
5. Videos are served via CloudFront (if configured)

## Supported Video Formats

- **MP4** (recommended - best browser compatibility)
- **MOV** (Apple format)
- **AVI** (Windows format)
- **MKV** (Matroska format - high quality)
- **WebM** (Web optimized)

### 📝 **Important Notes about MKV:**

- MKV files can be uploaded and stored in S3
- For web streaming, browsers may have limited MKV support
- Consider converting MKV to MP4 for better compatibility
- MKV files are typically larger but offer better quality

## Quality Recommendations

- **4K**: 15-25 Mbps bitrate
- **1080p**: 8-12 Mbps bitrate
- **720p**: 5-8 Mbps bitrate
- **480p**: 2-4 Mbps bitrate
