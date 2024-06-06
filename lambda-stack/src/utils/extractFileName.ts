export const extractFileName = (eventBody: any) => {
  return eventBody.detail.outputGroupDetails[0].outputDetails[0].outputFilePaths[0].split(
    "video-finished/"
  )[1];
};
