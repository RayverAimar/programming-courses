// The repo-specific half of the platform, registered once by createPlatform().
let A = null;
export const setAdapter = (a) => (A = a);
export const adapter = () => A;
