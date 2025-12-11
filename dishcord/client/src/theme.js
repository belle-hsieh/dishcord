import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#EF5A3C",      
      light: "#F57D63",      
      dark: "#C9452F",  
      contrastText: "#FFFFFF", 
    },

    secondary: {
      main: "#C9A86A",     
      light: "#DBC49C",
      dark: "#A68752",     
      contrastText: "#1A1A1A",
    },

    success: {
      main: "#6FA878",
      light: "#8FC295",
      dark: "#4F8055",
      contrastText: "#FFFFFF",
    },

    error: {
      main: "#D64545",
      light: "#E46B6B",
      dark: "#A63333",
      contrastText: "#FFFFFF",
    },

    warning: {
      main: "#E0A400",
      light: "#F0B927",
      dark: "#B38200",
      contrastText: "#1A1A1A",
    },

    info: {
      main: "#B7C9A8",
      light: "#D0DDBE",
      dark: "#8FA986",
      contrastText: "#1A1A1A",
    },

    background: {
      default: "#F8F5F2",   
      paper: "#FFFFFF",      
    },

    text: {
      primary: "#1A1A1A",      
      secondary: "#4D4D4D",  
      disabled: "#9E9E9E",     
    },

    divider: "#E2DAD2",

    action: {
      active: "#EF5A3C",
      hover: "rgba(239, 90, 60, 0.08)",      
      selected: "rgba(239, 90, 60, 0.12)",   
      disabled: "#BDBDBD",
      disabledBackground: "#F5F5F5",
      focus: "rgba(239, 90, 60, 0.05)",
    },
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#1A1A1A",
      letterSpacing: "-0.5px",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      color: "#1A1A1A",
      letterSpacing: "-0.25px",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      color: "#1A1A1A",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "#1A1A1A",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      color: "#1A1A1A",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      color: "#1A1A1A",
    },

    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.5,
      color: "#1A1A1A",
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.43,
      color: "#4D4D4D",
    },

    button: {
      fontSize: "0.875rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },

    caption: {
      fontSize: "0.75rem",
      fontWeight: 400,
      color: "#4D4D4D",
    },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
  },

  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "capitalize",
          fontWeight: 600,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.12)",
          },
        },
        contained: {
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
        },
        outlined: {
          borderWidth: "2px",
          "&:hover": {
            borderWidth: "2px",
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0px 2px 12px rgba(0, 0, 0, 0.08)",
          border: "1px solid #E2DAD2",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },

    // Paper: Warm background with subtle borders
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
        },
        elevation1: {
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
        },
        elevation3: {
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
        },
      },
    },

    // TextField: Clean, focused on primary accent
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            transition: "all 0.2s ease-in-out",
            "&:hover fieldset": {
              borderColor: "#EF5A3C",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#EF5A3C",
              borderWidth: "2px",
            },
          },
        },
      },
    },

    // Chip: Versatile, colorful accents
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
          fontWeight: 500,
        },
        filled: {
          backgroundColor: "#E2DAD2",
          color: "#1A1A1A",
        },
      },
    },

    MuiRating: {
      styleOverrides: {
        root: {
          color: "#C9A86A",
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "capitalize",
          fontWeight: 500,
          "&.Mui-selected": {
            color: "#EF5A3C",
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "12px",
          boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.15)",
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: "#E8F5E9",
          color: "#2E7D32",
        },
        standardError: {
          backgroundColor: "#FFEBEE",
          color: "#C62828",
        },
        standardWarning: {
          backgroundColor: "#FFF3E0",
          color: "#E65100",
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#E2DAD2",
        },
      },
    },

    MuiListItem: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(239, 90, 60, 0.04)",
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(239, 90, 60, 0.08)",
          },
        },
      },
    },
  },

  shape: {
    borderRadius: 8,
  },
});

export default theme;
