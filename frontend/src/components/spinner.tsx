// Spinner.js
import ClipLoader from 'react-spinners/ClipLoader';
import styled from 'styled-components';

const Spinner = () => {
    return (
        <SpinnerStyle>
            <div className="spinner-overlay">
                <ClipLoader size={50} color={"#123abc"} />
                <p>Cargando...</p>
            </div>
        </SpinnerStyle>
    );
};

export default Spinner;

const SpinnerStyle = styled.div `
    .spinner-overlay {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        z-index: 1000;
    }   

`