export default class HistoryManager
{
    classManager = []

    addManager(name, event)
    {
        this.classManager.push({ name: name, event: event })
    }

    newAction(manager, data)
    {

    }
}