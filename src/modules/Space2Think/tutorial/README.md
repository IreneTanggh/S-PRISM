# Tutorial System

A comprehensive, interactive tutorial system for Space2Think that guides users through exploring Yellowstone National Park data using React Joyride.

## 🏔️ Overview

This tutorial system provides a step-by-step guided tour through the Space2Think interface, specifically designed to work with Yellowstone National Park data. It's completely self-contained in a single folder and doesn't interfere with existing code.

## 📁 File Structure

```
tutorial/
├── index.js              # Main tutorial manager component
├── TutorialOverlay.js    # Joyride wrapper with custom controls
├── tutorialSteps.js      # Tutorial step definitions
├── tutorialData.js       # Tutorial state management and Yellowstone data
├── tutorialStyles.css    # Custom styling for tutorial elements
└── README.md             # This documentation
```

## 🚀 Features

- **Interactive Guided Tour**: Step-by-step exploration of Space2Think features
- **Yellowstone Dataset**: Pre-loaded with Yellowstone National Park information
- **Custom Controls**: Play, pause, skip, and close functionality
- **Progress Tracking**: Visual progress indicator and step counting
- **Responsive Design**: Works on desktop and mobile devices
- **Analytics Integration**: Tracks user engagement and completion rates
- **Non-intrusive**: Uses portals and overlays without affecting existing layout

## 🎯 Tutorial Steps

The tutorial covers 20 comprehensive steps:

1. **Welcome & Introduction** - Overview of the tutorial
2. **Toolbar Navigation** - Understanding the main interface
3. **File Operations** - Opening, saving, and managing datasets
4. **Search Functionality** - Finding specific information
5. **Report Generation** - AI-powered analysis creation
6. **Sidebar Configuration** - Customizing settings and prompts
7. **Workspace Exploration** - Navigating the main canvas
8. **Interactive Elements** - Clicking and highlighting documents
9. **Search Implementation** - Practical search examples
10. **Search Results** - Understanding search output
11. **Report Creation** - Generating comprehensive reports
12. **Configuration Options** - Customizing analysis focus
13. **Analysis Customization** - Tailoring reports to specific needs
14. **Model Settings** - Adjusting AI parameters
15. **Report Viewing** - Accessing generated content
16. **Interactive Reports** - Clickable keyword linking
17. **Work Persistence** - Saving and loading progress
18. **Completion** - Tutorial summary and next steps

## 🛠️ Integration

### Adding to Space2Think

1. **Import the tutorial manager**:
```javascript
import TutorialManager from './tutorial';
```

2. **Add tutorial button to toolbar**:
```javascript
<Tooltip title='Tutorial' placement='top'>
    <Button
        className='toolbar-item'
        style={{ color: '#8a817c' }}
        onClick={() => setTutorialVisible(true)}
    >
        <HelpOutlineIcon />
        Tutorial
    </Button>
</Tooltip>
```

3. **Render tutorial component**:
```javascript
<TutorialManager
    editor={editor}
    dispatch={dispatch}
    isVisible={tutorialVisible}
    onClose={() => setTutorialVisible(false)}
/>
```

### State Management

The tutorial system manages its own state and doesn't interfere with existing Redux state. It only requires:
- `editor` instance for Tldraw operations
- `dispatch` function for logging purposes
- `isVisible` boolean for showing/hiding
- `onClose` callback for cleanup

## 🎨 Customization

### Modifying Tutorial Steps

Edit `tutorialSteps.js` to customize:
- Step content and descriptions
- Target elements and positioning
- Interactive behaviors
- Content focus areas

### Styling Changes

Modify `tutorialStyles.css` to adjust:
- Colors and themes
- Layout positioning
- Animation effects
- Responsive breakpoints

### Data Management

Update `tutorialData.js` to:
- Change dataset information
- Modify tutorial configuration
- Adjust tracking parameters
- Customize Yellowstone content

## 🔧 Technical Details

### Dependencies

- **React Joyride**: Core tour functionality
- **Material-UI**: UI components and styling
- **Tldraw**: Canvas editor integration
- **Redux**: State management (optional, for logging)

### Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Performance

- Lightweight overlay system
- Efficient step tracking
- Minimal memory footprint
- Smooth animations

## 📊 Analytics & Tracking

The tutorial system tracks:
- Step completion rates
- User interaction patterns
- Time spent per step
- Overall completion time
- User engagement scores

### Logging Integration

Uses the existing logger system to record:
- Tutorial start/completion
- Step navigation
- User interactions
- Error conditions

## 🚨 Troubleshooting

### Common Issues

1. **Tutorial not starting**: Check if editor instance is available
2. **Steps not targeting correctly**: Verify CSS selectors in tutorialSteps.js
3. **Styling conflicts**: Ensure tutorialStyles.css loads after other styles
4. **Performance issues**: Check for large datasets or complex animations

### Debug Mode

Enable console logging by setting:
```javascript
console.log('[Tutorial] Debug mode enabled');
```

## 🔮 Future Enhancements

Potential improvements:
- Multi-language support
- Customizable themes
- Advanced analytics dashboard
- Integration with other datasets
- A/B testing for step optimization
- Accessibility improvements

## 📝 License

This tutorial system is part of the Space2Think project and follows the same licensing terms.

## 🤝 Contributing

To contribute to the tutorial system:
1. Follow the existing code style
2. Test with different datasets
3. Ensure mobile compatibility
4. Update documentation
5. Add appropriate logging

## 📞 Support

For issues or questions about the tutorial system:
1. Check the troubleshooting section
2. Review console logs for errors
3. Verify integration steps
4. Test with minimal setup

---

**Happy exploring! 🏔️** 