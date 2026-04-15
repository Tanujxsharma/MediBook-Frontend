export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

export const getUserContext = () => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payloadStart = token.indexOf('.') + 1;
    const payloadEnd = token.indexOf('.', payloadStart);
    if (payloadStart === 0 || payloadEnd === -1) return null;
    const base64Url = token.substring(payloadStart, payloadEnd);
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    return {
      ...payload,
      email: payload.email || payload.sub || '',
    };
  } catch (e) {
    return null;
  }
};
