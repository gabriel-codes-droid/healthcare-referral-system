const apiKey = 'AIzaSyBNXwhE3pKmz0BJAByhPIbsPSJCfTMwBE';
const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'validation@example.invalid', password: 'not-a-real-password', returnSecureToken: true })
});
console.log(response.status, await response.text());
