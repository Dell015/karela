export const GhostEngine = {
  getGhostPosition: (ghostData: any[], currentTime: number) => {
    if (!ghostData || ghostData.length === 0) return null;
    
    const point = ghostData.find((p) => p.timestamp === currentTime);

    return point || ghostData[ghostData.length - 1]
  }
}