import Event from "../types/Event";

interface JobsButtonProps {
    event: Event
    className: string | null
}

const JobsButton = ({event, className}: JobsButtonProps) => {
  return (
    <button
      className={className ?? ""}
      onClick={() => {
        if (event.jobsURL !== "") window.open(event.jobsURL, "_blank");
      }}
      disabled={event.jobsURL === ""}
    >
      {event.jobsURL === "" ? "No Party Job URL" : "Party Jobs"}
    </button>
  );
};

export default JobsButton;