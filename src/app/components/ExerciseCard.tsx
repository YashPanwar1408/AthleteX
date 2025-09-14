import { View, Text } from 'react-native'
import { Exercise } from '@/lib/sanity/types'

const getDifficultyColor = (difficulty:string)=>{
    switch(difficulty){
        case "beginner":
            return "bg-green-500";
        case "intermediate":
            return "bg-yellow-500";
        case "advanced":
            return "bg-red-500";
        default:
            return "bg-gray-500";   
    }
}
const getDifficultyText = (difficulty:string)=>{
    switch(difficulty){
        case "beginner":
            return "Beginner";
        case "intermediate":
            return "Intermediate";
        case "advanced":
            return "Advanced";
        default:
            return "Unknown";   
    }
}

interface ExerciseCardProps{
    item:Exercise;
    onPress:()=>void;
    showChevron?:boolean
}

export default function ExerciseCard({
    item,onPress,showChevron=false,
}:ExerciseCardProps) {
  return (
    <View>
      <Text>ExerciseCard</Text>
    </View>
  )
}