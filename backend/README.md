s3 conf

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

split video locally

```bash
split -b 10M ./video.mp4 ./video.mp4
```

Flash .flv video/x-flv
MPEG-4 .mp4 video/mp4
iPhone Index .m3u8 application/x-mpegURL
iPhone Segment .ts video/MP2T
3GP Mobile .3gp video/3gpp
QuickTime .mov video/quicktime
A/V Interleave .avi video/x-msvideo
Windows Media .wmv video/x-ms-wmv
