import React from 'react';
import './Loader.css';

const Loader = ({ text = "Loading..." }) => {
    return (
        <div className="book-loader-container">
            <div className="book">
                <div className="inner">
                    <div className="left"></div>
                    <div className="middle"></div>
                    <div className="right"></div>
                </div>
                <ul>
                    {[...Array(18)].map((_, i) => (
                        <li key={i}></li>
                    ))}
                </ul>
            </div>
            <p className="text-xl animate-pulse font-medium text-blue-400">{text}</p>
        </div>
    );
};

export default Loader;
