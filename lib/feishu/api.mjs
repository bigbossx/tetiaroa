import axios from "axios";
import { writeFileSync } from "fs";
const instance = axios.create({
  baseURL: "https://open.feishu.cn/open-apis",
  timeout: 10000,
  headers: { "Content-Type": "application/json; charset=utf-8" },
});

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const FeishuApi = {
  refreshAccessToken(app_access_token, refresh_token) {
    return instance("/authen/v1/refresh_access_token", {
      method: "POST",
      data: {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      },
      headers: {
        Authorization: `Bearer ${app_access_token}`,
      },
    });
  },
  getAppAccessToken(data) {
    return instance("/auth/v3/app_access_token/internal", {
      data,
      method: "POST",
    });
  },
  getTenantAccessToken(data) {
    return instance("/auth/v3/tenant_access_token/internal", {
      data,
      method: "POST",
    });
  },
  getUserAccessToken(code, tenant_access_token) {
    return instance("/authen/v1/access_token", {
      method: "POST",
      data: {
        grant_type: "authorization_code",
        code,
      },
      headers: {
        Authorization: `Bearer ${tenant_access_token}`,
      },
    });
  },
  generateAuthUrl(app_id, port) {
    return `https://open.feishu.cn/open-apis/authen/v1/index?app_id=${app_id}&redirect_uri=${encodeURIComponent(
      `http://localhost:${port}`
    )}`;
  },
  getSheet({ spreadsheetId, range, auth }) {
    return instance(
      `/sheets/v2/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      }
    );
  },
  writeAuthToDisk(tokenPath, data) {
    const now = Date.now();
    writeFileSync(
      tokenPath,
      JSON.stringify(
        {
          ...data,
          refresh_expires_in_timestamp: now + data.refresh_expires_in * 1000,
          expires_in_timestamp: now + data.expires_in * 1000,
        },
        null,
        2
      ),
      "utf-8"
    );
  },
};
