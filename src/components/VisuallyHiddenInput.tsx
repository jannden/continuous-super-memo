import { forwardRef, InputHTMLAttributes } from "react";
import styled from "styled-components";

const StyledInput = styled.input`
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
`;

export const VisuallyHiddenInput = forwardRef(
  (props: InputHTMLAttributes<HTMLInputElement>, ref) => {
    return <StyledInput ref={ref} {...props} />;
  }
);
