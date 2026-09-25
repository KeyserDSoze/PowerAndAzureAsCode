// Power Pages Server Logic source example.
// Create a Server Logic record named "health" and assign the intended Web Role.
// Server Logic is ECMAScript 2023 in a Microsoft-managed sandbox, not Node.js.

function get() {
  return {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: "ok",
      runtime: "power-pages-server-logic"
    })
  };
}
