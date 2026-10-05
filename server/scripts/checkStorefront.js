for (const route of ['/products', '/products/her-power', '/products/daily-vitality', '/checkout']) {
  const response = await fetch(`http://localhost:3000${route}`);
  const body = await response.text();
  console.log(response.status, route);
  if (!response.ok) { console.log(body.match(/.{0,60}(Cannot find|ReferenceError|ENOENT|TypeError|Error:).{0,400}/g)?.slice(0, 5)); process.exitCode = 1; }
}
