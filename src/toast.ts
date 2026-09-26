export function showToast(message: string) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.classList.add("toast", "inform");
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 1500);
}
