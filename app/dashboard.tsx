const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  console.log("Button ID clicked:", event.currentTarget.id);
};

<button id="profile-btn" onClick={handleClick}>
  Click Me
</button>;
