
export function formatDuration(seconds: number):string{
    if(seconds < 60){
        return `${seconds} s`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if(hours > 0){
        if(remainingSeconds > 0){
            return `${hours} h ${minutes} min ${remainingSeconds} s`;
        } else if(minutes > 0){
            return `${hours} h ${minutes} min`;
        } else {
            return `${hours} h`;
        }
    } else {
        if(remainingSeconds > 0){
            return `${minutes} min ${remainingSeconds} s`;
        } else {
            return `${minutes} min`;
        }
    }
}