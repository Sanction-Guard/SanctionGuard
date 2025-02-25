export const validateSearchRequest = (req, res, next) => {
    const { fullName } = req.body;
    
    if (!fullName || fullName.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search name is required'
      });
    }
    
    next();
  };