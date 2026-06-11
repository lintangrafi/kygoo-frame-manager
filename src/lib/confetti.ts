export function burstConfetti(container: HTMLElement) {
  const colors = ["#D4872B", "#F5A623", "#2D1810", "#8B6914", "#5C2D1A"];
  const rect = container.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const count = 30;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const velocity = 80 + Math.random() * 100;
    const size = 6 + Math.random() * 6;
    const rotation = Math.random() * 360;
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top: ${cy}px;
      width: ${size}px;
      height: ${size * 0.6}px;
      background: ${color};
      border-radius: 2px;
      pointer-events: none;
      z-index: 9999;
      opacity: 1;
      transform: rotate(${rotation}deg);
      transition: all 0.8s cubic-bezier(0.25, 1, 0.5, 1);
    `;

    document.body.appendChild(particle);

    requestAnimationFrame(() => {
      particle.style.transform = `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity - 40}px) rotate(${rotation + 360}deg)`;
      particle.style.opacity = "0";
    });

    setTimeout(() => particle.remove(), 900);
  }
}
