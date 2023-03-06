import React from "react";
import styled, { keyframes } from "styled-components";

const blinkingEffect = () => keyframes`
  50% {
    border-left: 1px solid black;
  background-color: lightgray;
  }
`;

const AnimatedComponent = styled.span`
  background-color: #f3f3f3;
  border-left: 1px solid transparent;
  animation: ${blinkingEffect} 1.2s linear infinite alternate;
`;

export default function Letter({ className, children, blinking }) {
  if (blinking) {
    return (
      <AnimatedComponent className={className}>{children}</AnimatedComponent>
    );
  }
  return <span className={className}>{children}</span>;
}
