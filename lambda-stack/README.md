yarn build

enable docker

yarn --prod

sh ffmpeg/build.sh

if s3 bucket for cdk is removed, delete cloudformation on aws
npx cdk bootstrap --force
npx cdk deploy
