export const handleUnauthorized = () => {
    localStorage.removeItem('token');
    window.location.replace('/login');
};
