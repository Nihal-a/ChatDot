export const fetchWithAuth = async (url, options = {}) => {
  let res = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (res.status === 401 && !options._retry) {
    const refreshRes = await fetch(
      "http://192.168.18.144:8000/api/token/refresh-cookie/",
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (refreshRes.ok) {
      res = await fetch(url, {
        ...options,
        credentials: "include",
        _retry: true,
      });
    } else {
      console.warn("Refresh token invalid. Logging out.");
    }
  }

  return res;
};
