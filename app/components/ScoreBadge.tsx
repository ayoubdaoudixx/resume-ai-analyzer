interface ScoreBadgeProps {
  score: number;
}

const ScoreBadge = ({ score }: ScoreBadgeProps) => {
  const getBadgeStyles = () => {
    if (score > 70) {
      return {
        bgColor: 'bg-badge-green',
        textColor: 'text-green-600',
        label: 'Strong'
      };
    } else if (score > 49) {
      return {
        bgColor: 'bg-badge-yellow',
        textColor: 'text-yellow-600',
        label: 'Good Start'
      };
    } else {
      return {
        bgColor: 'bg-badge-red',
        textColor: 'text-red-600',
        label: 'Needs to be improved'
      };
    }
  };

  const { bgColor, textColor, label } = getBadgeStyles();

  return (
    <div className={`${bgColor} ${textColor} px-3 py-1 rounded-full inline-block`}>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
};

export default ScoreBadge;
