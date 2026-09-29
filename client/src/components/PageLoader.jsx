// poori screen ka spinner — lazy page load ho raha ho ya login check chal raha ho tab
function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3]">
            <div
                className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"
                aria-label="Loading"
            />
        </div>
    );
}

export default PageLoader;
