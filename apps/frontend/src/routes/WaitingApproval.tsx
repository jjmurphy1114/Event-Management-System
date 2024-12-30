import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function WaitingApproval() {
    const auth = getAuth();
    const navigate = useNavigate();

    return(
        <div className='w-screen h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-gray-100 overflow-auto'>
            <h1 className="text-center size-1/2 font-semibold text-gray-700">
                Your account has been sent to the Social Chairs for approval!
            </h1>
        </div>
    )
}