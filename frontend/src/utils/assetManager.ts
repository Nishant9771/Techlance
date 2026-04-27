const ASSETS: Record<string, string[]> = {
  shop: Array.from({ length: 10 }, (_, i) => `/assets/images/shop/shop${i + 1}.jpg`),
  cuts: Array.from({ length: 10 }, (_, i) => `/assets/images/cuts/cut${i + 1}.jpg`),
  profiles: Array.from({ length: 10 }, (_, i) => `/assets/images/profiles/prof${i + 1}.jpg`),
  projects: Array.from({ length: 10 }, (_, i) => `/assets/images/projects/proj${i + 1}.jpg`),
  ui: Array.from({ length: 10 }, (_, i) => `/assets/images/ui/ui${i + 1}.jpg`),
};

export function getSmartImage(category = "shop", index = 0) {
  const arr = ASSETS[category] || ASSETS.shop;
  return arr[index % arr.length];
}

// kept for existing rotation logic usage
export function getNextIndex(prev: number, length: number) {
  return (prev + 1) % length;
}

export function getSmartVideo(index = 0) {
  const videos = [
    "/assets/videos/video1.mp4",
    "/assets/videos/video2.mp4",
    "/assets/videos/video3.mp4",
    "/assets/videos/video4.mp4",
    "/assets/videos/video5.mp4"
  ];
  return videos[index % videos.length];
}
