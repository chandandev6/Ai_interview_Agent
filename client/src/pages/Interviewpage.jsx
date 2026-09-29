import { useState } from "react";
import Step1setup from "../components/Step1setup";
import Step2interview from "../components/Step2interview";
import Step3report from "../components/Step3report";

function Interviewpage() {
    const [step, setStep] = useState(1);
    const [interviewData, setInterviewData] = useState(null);

    return (
        <div className="min-h-screen bg-gray-50">
            {step === 1 && (
                <Step1setup
                    onStart={(data) => {
                        setInterviewData(data);
                        setStep(2);
                    }}
                />
            )}
            {step === 2 && (
                <Step2interview
                    interviewData={interviewData}
                    onFinish={(report) => {
                        setInterviewData(report);
                        setStep(3);
                    }}
                />
            )}
            {step === 3 && <Step3report report={interviewData} />}
        </div>
    );
}

export default Interviewpage;
