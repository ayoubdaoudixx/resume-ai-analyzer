import { useParams } from "react-router"

export const meta = () => ([
    { title: 'Resumer | Review'},
    { nam: 'description', content: 'Detailed Review Of Your Resume'},
])

const Resume = () => {

    const {id} = useParams();

    return (
        <div> Resume {id} </div> 
    )
}

export default Resume