import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  userSkills: string[];
  jobSkills: string[];
}

const SkillRadarChart: React.FC<Props> = ({ userSkills, jobSkills }) => {
  const allSkills = Array.from(new Set([...userSkills, ...jobSkills]));

  const data = {
    labels: allSkills,
    datasets: [
      {
        label: "Your Skills",
        data: allSkills.map(skill => userSkills.includes(skill) ? 1 : 0),
        backgroundColor: "rgba(34, 202, 236, 0.2)",
        borderColor: "rgba(34, 202, 236, 1)",
        borderWidth: 2
      },
      {
        label: "Job Requirements",
        data: allSkills.map(skill => jobSkills.includes(skill) ? 1 : 0),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2
      }
    ]
  };

  return <Radar data={data} />;
};

export default SkillRadarChart;
