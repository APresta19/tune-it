// Fisher-Yates shuffle
export default function shuffleArray(arr)
{
  let currentIndex = arr.length;
  while(currentIndex != 0)
  {
    currentIndex--;
    const randomIndex = Math.floor(Math.random() * (currentIndex+1));

    // Swap
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]]
  }
  return arr;
}