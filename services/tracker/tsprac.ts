type MissionStatus = "idle" | "in_progress" | "completed" | "failed";
type UserRank = "Rookie" | "Pro" | "Elite" | "Legend";
type SignalStrength = "weak" | "strong" | "none";

let myMissionStatus: MissionStatus = "idle";

interface Runner {
    name: string;
    xp: number;
    rank: UserRank;
}

const me: Runner = {
    name: "Randel",
    xp: 670,
    rank: "Rookie",
}

interface LocationUpdate {
    lat: number;
    lon: number;
    status: SignalStrength;
}

const calculateProgress = (current: number, goal: number): number => {
    return (current/goal) * 100;
}

const getStatusReport = (runner: Runner): string => {
    return `${runner.name} is a ${runner.rank} with ${runner.xp} XP`;
};

const checkSignal = (Update: LocationUpdate) => {
    if (Update.status === "strong") {
        return "System Ready"
    } else {
        return "Searching for GPS..."
    }
}

console.log(getStatusReport(me));