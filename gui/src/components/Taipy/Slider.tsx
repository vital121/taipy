import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { SxProps } from "@mui/material";
import MuiSlider from "@mui/material/Slider";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

import { TaipyContext } from "../../context/taipyContext";
import { createSendUpdateAction } from "../../context/taipyReducers";
import { useDynamicProperty } from "../../utils/hooks";
import { LovImage, LovProps, useLovListMemo } from "./lovUtils";
import { getCssSize, getUpdateVar } from "./utils";
import { Icon } from "../../utils/icon";

interface SliderProps extends LovProps<number | string, number | string> {
    width?: string;
    height?: string;
    min?: number;
    max?: number;
    textAnchor?: string;
    alwaysUpdate?: boolean;
    labels?: string | boolean;
    orientation?: string;
}

const Slider = (props: SliderProps) => {
    const {
        className,
        id,
        updateVarName,
        propagate = true,
        defaultValue,
        lov,
        defaultLov = "",
        textAnchor = "bottom",
        width = "300px",
        updateVars = "",
        valueById,
    } = props;
    const [value, setValue] = useState(0);
    const { dispatch } = useContext(TaipyContext);

    const active = useDynamicProperty(props.active, props.defaultActive, true);
    const hover = useDynamicProperty(props.hoverText, props.defaultHoverText, undefined);
    const lovList = useLovListMemo(lov, defaultLov);

    const update = useMemo(
        () => (props.alwaysUpdate === undefined ? lovList.length === 0 : props.alwaysUpdate),
        [lovList, props.alwaysUpdate]
    );

    const min = lovList.length ? 0 : props.min;
    const max = lovList.length ? lovList.length - 1 : props.max;
    const horizontalOrientation = props.orientation ? props.orientation.charAt(0).toLowerCase() !== "v" : true;

    const handleRange = useCallback(
        (e, val: number | number[]) => {
            setValue(val as number);
            if (update) {
                const value = lovList.length && lovList.length > (val as number) ? lovList[val as number].id : val;
                dispatch(createSendUpdateAction(updateVarName, value, propagate, valueById ? undefined : getUpdateVar(updateVars, "lov")));
            }
        },
        [lovList, update, updateVarName, dispatch, propagate, updateVars, valueById]
    );

    const handleRangeCommitted = useCallback(
        (e, val: number | number[]) => {
            setValue(val as number);
            if (!update) {
                const value = lovList.length && lovList.length > (val as number) ? lovList[val as number].id : val;
                dispatch(createSendUpdateAction(updateVarName, value, propagate, valueById ? undefined : getUpdateVar(updateVars, "lov")));
            }
        },
        [lovList, update, updateVarName, dispatch, propagate, updateVars, valueById]
    );

    const getLabel = useCallback(
        (value) =>
            lovList.length && lovList.length > value ? (
                typeof lovList[value].item === "string" ? (
                    <Typography>{lovList[value].item}</Typography>
                ) : (
                    <LovImage item={lovList[value].item as Icon} />
                )
            ) : (
                <>{value}</>
            ),
        [lovList]
    );

    const getText = useCallback(
        (value, before) => {
            if (lovList.length) {
                if (before && (textAnchor === "top" || textAnchor === "left")) {
                    return getLabel(value);
                }
                if (!before && (textAnchor === "bottom" || textAnchor === "right")) {
                    return getLabel(value);
                }
            }
            return null;
        },
        [lovList, textAnchor, getLabel]
    );

    const marks = useMemo(() => {
        if (props.labels) {
            if (typeof props.labels === "boolean") {
                if (lovList.length) {
                    return lovList.map((it, idx) => ({ value: idx, label: getLabel(idx) }));
                }
            } else {
                try {
                    const labels = JSON.parse(props.labels);
                    const marks: Array<{ value: number; label: string }> = [];
                    Object.keys(labels).forEach((key) => {
                        if (labels[key]) {
                            let idx = lovList.findIndex((it) => it.id === key);
                            if (idx == -1) {
                                try {
                                    idx = parseInt(key, 10);
                                } catch (e) {
                                    // too bad
                                }
                            }
                            if (idx != -1) {
                                marks.push({ value: idx, label: labels[key] });
                            }
                        }
                    });
                    if (marks.length) {
                        return marks;
                    }
                } catch (e) {
                    // won't happen
                }
            }
        }
        return lovList.length > 0;
    }, [props.labels, lovList, getLabel]);

    const textAnchorSx = useMemo(() => {
        const sx = horizontalOrientation ? { width: getCssSize(width) } : { height: getCssSize(props.height || width) };
        if (lovList.length) {
            if (textAnchor === "top" || textAnchor === "bottom") {
                return { ...sx, display: "inline-grid", gap: "0.5em", textAlign: "center" } as SxProps;
            }
            if (textAnchor === "left" || textAnchor === "right") {
                return {
                    ...sx,
                    display: "inline-grid",
                    gap: "1em",
                    gridTemplateColumns: textAnchor === "left" ? "auto 1fr" : "1fr auto",
                    alignItems: "center",
                } as SxProps;
            }
        }
        return { ...sx, display: "inline-block" };
    }, [lovList, horizontalOrientation, textAnchor, width, props.height]);

    useEffect(() => {
        if (props.value === undefined) {
            let val = 0;
            if (defaultValue !== undefined) {
                if (typeof defaultValue === "string") {
                    if (lovList.length) {
                        try {
                            const arrVal = JSON.parse(defaultValue) as string[];
                            val = lovList.findIndex((item) => item.id === arrVal[0]);
                            val = val === -1 ? 0 : val;
                        } catch (e) {
                            // Too bad also
                        }
                    } else {
                        try {
                            val = parseInt(defaultValue, 10);
                        } catch (e) {
                            // too bad
                        }
                    }
                } else {
                    val = defaultValue as number;
                }
            }
            setValue(val);
        } else {
            if (lovList.length) {
                const val = lovList.findIndex((item) => item.id === props.value);
                setValue(val === -1 ? 0 : val);
            } else {
                setValue(props.value as number);
            }
        }
    }, [props.value, lovList, defaultValue]);

    return (
        <Box sx={textAnchorSx} className={className}>
            {getText(value, true)}
            <Tooltip title={hover || ""}>
                <MuiSlider
                    id={id}
                    value={value as number}
                    onChange={handleRange}
                    onChangeCommitted={handleRangeCommitted}
                    disabled={!active}
                    valueLabelDisplay="auto"
                    min={min}
                    max={max}
                    step={1}
                    marks={marks}
                    valueLabelFormat={getLabel}
                    orientation={horizontalOrientation ? undefined : "vertical"}
                />
            </Tooltip>
            {getText(value, false)}
        </Box>
    );
};

export default Slider;
