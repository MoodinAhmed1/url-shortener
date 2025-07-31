import React from 'react'

function handleForm() {

}

const page = () => {
  return (
    <div>
      <form action={handleForm}>
        <label htmlFor="newUser">New Username</label>
        <input type="text" name="newUser" id="newUser" />

        <label htmlFor="password">Comfirm Password</label>
        <input type="password" name="password" id="password" />

        
      </form>
    </div>
  )
}

export default page