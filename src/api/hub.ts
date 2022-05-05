import { request } from 'undici';

export default class HubGroupAPI {
  private readonly defaultBaseUrl = 'https://63d6be0e-bd49-4c76-8fe5-195bb7cf88a5.mock.pstmn.io';
  private readonly baseUrl: string;

  private readonly apiPath = '/ent/api/templates/bundlegroups';

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || this.defaultBaseUrl;
  }

  async callApi(uri: string): Promise<any[]> {
    const response = await request(`${this.baseUrl}${uri}`);
    const { statusCode, body } = response;

    return (statusCode === 200) ? body.json() : Promise.reject(response);
  }

  getHubGroups(): Promise<any[]> {
    return this.callApi(this.apiPath);
  }

  getHubGroupById(versionId: number): Promise<any[]> {
    return this.callApi(`${this.apiPath}/${versionId}`);
  }

  getHubGroupByName(name: string): Promise<any[]> {
    return this.callApi(`${this.apiPath}?name=${name}`);
  }
}
