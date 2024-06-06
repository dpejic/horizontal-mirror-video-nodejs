import { Lifetime, asClass } from 'awilix';
import { FastifyInstance } from 'fastify';
import EventSource from 'eventsource';

import { buildApp } from '../../app';

import { S3Mock } from '../../__mocks__/sdk/s3/s3';
import { GetMultipartPresignedUrlsResponseType } from '../../schemas/GetMultipartPresignedUrls.schema';
import { SSEEvents } from '../../types/SSEEvents';
import { SQSEventNotificationQueue, SQSUploadQueue } from '../../__mocks__/sdk/sqs';

jest.mock('../../sdk/s3/s3');
jest.mock('../../sdk/sqs', () => ({
  __esModule: true,
}));

let app: FastifyInstance;

beforeEach(async () => {
  app = buildApp({
    s3: asClass(S3Mock, { lifetime: Lifetime.SINGLETON }),
    sqsUploadQueue: asClass(SQSUploadQueue, { lifetime: Lifetime.SINGLETON }),
    sqsEventNotificationQueue: asClass(SQSEventNotificationQueue, { lifetime: Lifetime.SINGLETON }),
  });

  await app.ready();
});

afterEach(async () => {
  await app.close();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('multipart upload', () => {
  it('/get-multipart-presigned-urls - should return status code 200 and 2 parts to upload for 20mb', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/upload/get-multipart-presigned-urls',
      body: {
        bufferSize: 20971520,
        mime: 'video/webm',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().partSignedUrlList.length).toBe(2);
  });

  it('should succeed multipart upload', async () => {
    const presignedUrlsResponse = await app.inject({
      method: 'POST',
      url: '/api/upload/get-multipart-presigned-urls',
      body: {
        bufferSize: 20971520,
        mime: 'video/webm',
      },
    });

    const { fileName, partSignedUrlList, uploadId } =
      presignedUrlsResponse.json() as unknown as GetMultipartPresignedUrlsResponseType;

    const modifiedParts = partSignedUrlList.map((item) => ({ PartNumber: item.PartNumber, ETag: '"ETagTest"' }));

    const getHeadObjectSpy = jest.spyOn(app.diContainer.cradle.s3, 'getHeadObject').mockResolvedValueOnce({
      ETag: '"ETagTest"',
      $metadata: {},
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/upload/finalize-multipart',
      body: {
        fileName: fileName,
        uploadId: uploadId,
        checksum: 'ETagTest',
        parts: modifiedParts,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().fileName).toBe(fileName);

    getHeadObjectSpy.mockRestore();
  });

  it('should fail if checksum do not match', async () => {
    const presignedUrlsResponse = await app.inject({
      method: 'POST',
      url: '/api/upload/get-multipart-presigned-urls',
      body: {
        bufferSize: 20971520,
        mime: 'video/webm',
      },
    });

    const { fileName, partSignedUrlList, uploadId } =
      presignedUrlsResponse.json() as unknown as GetMultipartPresignedUrlsResponseType;

    const modifiedParts = partSignedUrlList.map((item, index) => ({
      PartNumber: item.PartNumber,
      ETag: `"ETagTestFailed${index}"`,
    }));

    const getHeadObjectSpy = jest.spyOn(app.diContainer.cradle.s3, 'getHeadObject').mockResolvedValueOnce({
      ETag: '"ETagTest"',
      $metadata: {},
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/upload/finalize-multipart',
      body: {
        fileName: fileName,
        uploadId: uploadId,
        checksum: 'ETagTestFailed',
        parts: modifiedParts,
      },
    });

    expect(response.statusCode).toBe(400);

    getHeadObjectSpy.mockRestore();
  });
});

describe('single upload', () => {
  describe('/presigned-url - get presigned url', () => {
    it('should return presigned url', async () => {
      const expredUrl = 'https://putpresignedurl.com';
      const putPresignedUrlSpy = jest
        .spyOn(app.diContainer.cradle.s3, 'putPresignedUrl')
        .mockResolvedValueOnce(expredUrl);

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload/presigned-url',
        body: {
          mime: 'video/webm',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().url).toBe(expredUrl);
      expect(response.json().fileName).toBeDefined();

      putPresignedUrlSpy.mockRestore();
    });

    it('should throw an error for not valid formats', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/upload/presigned-url',
        body: {
          mime: 'failMime',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('/presigned-url-by-name - get presigned url with exact filename', () => {
    it('should return presigned url with exact filename provided', async () => {
      const expredUrl = 'https://putpresignedurl.com';
      const expectedFileName = 'fileNameTest';

      const putPresignedUrlSpy = jest
        .spyOn(app.diContainer.cradle.s3, 'putPresignedUrl')
        .mockResolvedValueOnce(expredUrl);

      const response = await app.inject({
        method: 'POST',
        url: '/api/upload/presigned-url-by-name',
        body: {
          mime: 'video/webm',
          fileName: expectedFileName,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().url).toBe(expredUrl);
      expect(response.json().fileName).toBe(expectedFileName);

      putPresignedUrlSpy.mockRestore();
    });

    it('should throw an error for not valid formats', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/upload/presigned-url-by-name',
        body: {
          mime: 'failMime',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});

describe('/get-presigned-url - get url of object stored', () => {
  it('should return url to get object', async () => {
    const expectedUrl = 'https://putpresignedurl.com';

    const getPresignedUrlSpy = jest
      .spyOn(app.diContainer.cradle.s3, 'getPresignedUrl')
      .mockResolvedValueOnce(expectedUrl);

    const response = await app.inject({
      method: 'POST',
      url: '/api/upload/get-presigned-url',
      body: {
        fileName: 'fileName.mp4',
        folder: 'videos',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().url).toBe(expectedUrl);

    getPresignedUrlSpy.mockRestore();
  });

  it('should throw an error if object does not exists', async () => {
    const getPresignedUrlSpy = jest
      .spyOn(app.diContainer.cradle.s3, 'getPresignedUrl')
      .mockRejectedValueOnce(new Error());

    const response = await app.inject({
      method: 'POST',
      url: '/api/upload/get-presigned-url',
      body: {
        fileName: 'fileName.mp4',
        folder: 'videos',
      },
    });

    expect(response.statusCode).toBe(400);

    getPresignedUrlSpy.mockRestore();
  });
});

describe('sse', () => {
  it('should get response back that uploading has been finished', (done) => {
    const runFunction = async () => {
      await app.listen({ port: 0 });
      const addresses = app.addresses()[0];

      const clientId = '8bdfdbff-e75a-47a6-aced-35a570fb2274.mp4';

      const es = new EventSource(`http://localhost:${addresses.port}/api/upload/sse?id=${clientId}`);

      es.onmessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.message === SSEEvents.STREAM_STARTED) {
          app.diContainer.cradle.sseDispatcherService.dispatch(
            JSON.stringify({ message: SSEEvents.SUCCESS_UPLOAD, id: clientId }),
            clientId,
          );
        }

        if (data.message === SSEEvents.SUCCESS_UPLOAD) {
          expect(data.id).toBe(clientId);

          await es.close();

          done();
        }
      };

      es.onopen = () => {
        const connectedClients = app.diContainer.cradle.sseDispatcherService.clients;
        expect(connectedClients[clientId]).toBeDefined();
      };
    };
    runFunction();
  });
});
