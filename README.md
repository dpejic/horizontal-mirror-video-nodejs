# Horizontal Mirror Video

## Overview

This project is designed to mirror horizontal video files using an AWS Lambda function. The process involves streaming video files from Amazon S3, converting them to MP4 format using AWS MediaConvert, and utilizing FFmpeg for video processing.
Main focus is on backend side that is built with Fastify and uses dependency injection with Awilix, while the frontend is developed using React.

## Project Structure

- **backend/**: Contains the Fastify backend code.
- **frontend/**: Contains the React frontend code.
- **lambda-stack/**: Contains the AWS CDK infrastructure code and Lambda function code.

## Diagram

<img src="https://i.ibb.co/MnkS7GP/sequence-diagram.png">

## Example

<img src="https://i.ibb.co/n6t8SqP/video-example.gif" width="200" height="400">
<img src="https://i.ibb.co/BCDkC6k/media-recorder.png" width="200" height="400">
